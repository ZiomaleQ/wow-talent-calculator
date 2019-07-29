import React from 'react'
import { connect } from 'react-redux'
import { match } from 'react-router-dom'
import { RouteComponentProps } from 'react-router'
import Calculator from '../components/Calculator'
import { ClassPicker } from '../components/ClassPicker'
import { classByName, classById } from '../data/classes'
import { AppState } from '../store'
import { setClass, setPoints } from '../store/calculator/actions'
import { Points } from '../store/calculator/types'
import { decodeKnownTalents, encodeKnownTalents } from '../lib/tree'

interface Props extends RouteComponentProps {
  match: match<{ 
    selectedClass: string
    pointString: string
  }>
  classId: number
  points: Points
  setClass: typeof setClass
  setPoints: typeof setPoints
}

export class Home extends React.PureComponent<Props> {
  static whyDidYouRender = true

  get classSlug() {
    return classById[this.props.classId] && classById[this.props.classId].name.toLowerCase()
  }

  componentDidMount() {
    this.loadFromUrlParams()
  }

  componentDidUpdate(prevProps: Props) {
    const prevParams = prevProps.match.params
    const { params } = this.props.match

    if (prevParams.selectedClass !== params.selectedClass) {
      // Class changed in route
      this.loadFromUrlParams()
    } else {
      // Changes within same class
      if (prevParams.pointString !== params.pointString) {
        // Same class but point string changed
        const decoded = decodeKnownTalents(params.pointString || '', this.props.classId)
        if (!this.props.points.equals(decoded)) {
          this.props.setPoints(decoded)
        }
      } else if (prevProps.points !== this.props.points) {
        // Points map changed, update the URL
        this.updateURL(this.props.points)
      }
    } 
  }

  componentWillUnmount() {
    this.props.setClass(null)
  }

  loadFromUrlParams() {
    const { selectedClass, pointString } = this.props.match.params
    const c = selectedClass && classByName[selectedClass]
    if (c) {
      const points = pointString && decodeKnownTalents(pointString || '', c.id)
      this.props.setClass(c.id, points)
    } else {
      this.props.setClass(null)
      this.props.history.replace('/')
    }
  }

  updateURL(points: Points) {
    const { classId } = this.props
    const pointsString = encodeKnownTalents(points, classId)
    if (pointsString !== this.props.match.params.pointString) {
      this.props.history.replace(`/${this.classSlug}` + (pointsString ? `/${pointsString}` : ''))
    }
  }

  render() {
    const { match, classId } = this.props
    const { selectedClass } = match.params

    const currentClass = classById[classId]
    if (classId && !currentClass) {
      // We're redirecting to /
      return null
    }

    return (
      <div className="container index">
        <ClassPicker 
          className="index__class-picker"
          center 
          selected={selectedClass} 
        />
  
        {currentClass && 
          <Calculator 
            classId={classId}
            points={this.props.points}
          />
        }
      </div>
    )
  }
}

export default connect(
  ({ calculator }: AppState) => ({ 
    classId: calculator.classId,
    points: calculator.points,
  }),
  { setClass, setPoints }
)(Home)